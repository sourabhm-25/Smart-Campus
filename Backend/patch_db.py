import sys, os
sys.path.append(os.getcwd())
try:
    from core.database import classes_collection, users_collection
    from bson import ObjectId
    
    user = users_collection.find_one({'email': '07tanishkap@gmail.com'})
    if user:
        user_id = user['_id']
        users_collection.update_one({'_id': user_id}, {'$set': {'school': 'Smart Campus', 'grades': ['8'], 'subjects': ['Mathematics', 'Science']}})
        
        # Check if class exists
        cls = classes_collection.find_one({'school': 'Smart Campus', 'grade': '8'})
        from datetime import datetime
        if not cls:
            classes_collection.insert_one({'school': 'Smart Campus', 'grade': '8', 'teachers': [{'teacher_id': user_id, 'subject': 'Mathematics'}, {'teacher_id': user_id, 'subject': 'Science'}], 'students': [], 'parents': [], 'created_at': datetime.utcnow(), 'created_by': user_id})
        else:
            classes_collection.update_one({'_id': cls['_id']}, {'$push': {'teachers': {'$each': [{'teacher_id': user_id, 'subject': 'Mathematics'}, {'teacher_id': user_id, 'subject': 'Science'}]}}})
        print('Successfully patched user and class!')
except Exception as e:
    print('Error:', e)
